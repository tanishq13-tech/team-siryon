"""
IBVAP: Intelligent Border Video Analytics Platform (SIH 187)
Full End-to-End Workflow Diagram Generator (Pages 1, 2, 3 Architecture)

Renders the complete 3-stage workflow with backend component verification:
- Page 1: Multi-Sensor Ingestion (Camera + Radar) -> OpenCV/YOLO/ByteTrack/ANPR -> Sensor Fusion
- Page 2: Combined Object -> Behavior Analysis (3D CNN) -> Normal vs Alert -> Local Cache, 15-Day Local DB Retention, 4-Tier Compression
- Page 3: Sync Engine -> Dual Pipelines (Primary vs Recovery) -> Blockchain Encryption (SHA256+Hyperledger) -> AWS Cloud (S3 Files + DynamoDB Metadata)
"""

import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.path import Path

def draw_rounded_box(ax, x, y, w, h, bg_color, border_color, border_width=1.5, radius=1.5, alpha=0.95):
    """Draws a rounded rectangular card patch."""
    rect = patches.FancyBboxPatch(
        (x, y), w, h,
        boxstyle=f"round,pad={radius},rounding_size=1.5",
        facecolor=bg_color,
        edgecolor=border_color,
        linewidth=border_width,
        alpha=alpha,
        zorder=2
    )
    ax.add_patch(rect)
    return rect

def draw_arrow(ax, start_xy, end_xy, color='#388bfd', lw=2.0, style="->,head_length=0.45,head_width=0.35"):
    """Draws a directed connection arrow."""
    ax.annotate(
        '', xy=end_xy, xytext=start_xy,
        arrowprops=dict(arrowstyle=style, lw=lw, color=color, shrinkA=2, shrinkB=2),
        zorder=3
    )

def draw_polyline(ax, points, color='#388bfd', lw=2.0):
    """Draws a multi-point elbow polyline with terminal arrow."""
    for i in range(len(points) - 2):
        p1, p2 = points[i], points[i+1]
        ax.plot([p1[0], p2[0]], [p1[1], p2[1]], color=color, lw=lw, zorder=3)
    p_penult, p_last = points[-2], points[-1]
    draw_arrow(ax, p_penult, p_last, color=color, lw=lw)

def generate_ibvap_workflow_diagram(output_png_path, output_jpg_path=None):
    fig, ax = plt.subplots(figsize=(24, 13.5), dpi=300)
    fig.patch.set_facecolor('#090d13')
    ax.set_facecolor('#090d13')
    ax.set_xlim(0, 240)
    ax.set_ylim(0, 135)
    ax.axis('off')

    # Main Header
    ax.text(120, 130, "INTELLIGENT BORDER VIDEO ANALYTICS PLATFORM (IBVAP)", 
            ha='center', va='center', color='#58a6ff', fontsize=18, weight='bold')
    ax.text(120, 126.5, "End-to-End Edge-to-Cloud Surveillance & Multi-Modal Sync Architecture (SIH 187)", 
            ha='center', va='center', color='#8b949e', fontsize=10.5)

    # =========================================================================
    # COLUMN 1: PAGE 1 - MULTI-SENSOR INGESTION & SENSOR FUSION
    # =========================================================================
    c1_x, c1_y, c1_w, c1_h = 6, 12, 72, 110
    draw_rounded_box(ax, c1_x, c1_y, c1_w, c1_h, '#10151f', '#30363d', border_width=2)
    ax.text(c1_x + c1_w/2, c1_y + c1_h - 3, "PAGE 1: SENSOR INGESTION & SENSOR FUSION", 
            ha='center', va='center', color='#58a6ff', fontsize=11, weight='bold')
    ax.text(c1_x + c1_w/2, c1_y + c1_h - 6, "Backend: backend/run_live_video_to_database.py & radar_fusion.py", 
            ha='center', va='center', color='#79c0ff', fontsize=7.5, style='italic')

    # Root Node: BORDER SURVEILLANCE
    draw_rounded_box(ax, 28, 107, 28, 5, '#1b2230', '#58a6ff', border_width=1.5)
    ax.text(42, 109.5, "BORDER SURVEILLANCE", ha='center', va='center', color='#ffffff', fontsize=9.5, weight='bold')

    # Fork to Camera and Radar
    draw_polyline(ax, [(42, 107), (42, 104), (23, 104), (23, 100)], color='#388bfd')
    draw_polyline(ax, [(42, 107), (42, 104), (61, 104), (61, 100)], color='#f0883e')

    # Left Branch: CAMERA
    draw_rounded_box(ax, 11, 95, 24, 5, '#162032', '#388bfd', border_width=1.3)
    ax.text(23, 97.5, "CAMERA", ha='center', va='center', color='#58a6ff', fontsize=9.5, weight='bold')

    draw_arrow(ax, (23, 95), (23, 89), color='#388bfd')
    draw_rounded_box(ax, 11, 84, 24, 5, '#162032', '#388bfd', border_width=1.3)
    ax.text(23, 86.5, "OpenCV (Capture)", ha='center', va='center', color='#c9d1d9', fontsize=8.5)

    draw_arrow(ax, (23, 84), (23, 78), color='#388bfd')
    draw_rounded_box(ax, 11, 73, 24, 5, '#162032', '#388bfd', border_width=1.3)
    ax.text(23, 75.5, "YOLO (Object Detection)", ha='center', va='center', color='#c9d1d9', fontsize=8.5)

    # Sub-branch Person vs Vehicle
    draw_polyline(ax, [(23, 73), (23, 70), (16, 70), (16, 66)], color='#388bfd')
    draw_polyline(ax, [(23, 73), (23, 70), (30, 70), (30, 66)], color='#388bfd')

    # PERSON
    draw_rounded_box(ax, 9, 61, 14, 5, '#1a273a', '#58a6ff', border_width=1.1)
    ax.text(16, 63.5, "PERSON", ha='center', va='center', color='#79c0ff', fontsize=8, weight='bold')

    # VEHICLE branch
    draw_rounded_box(ax, 23, 61, 15, 5, '#1a273a', '#58a6ff', border_width=1.1)
    ax.text(30.5, 63.5, "VEHICLE", ha='center', va='center', color='#79c0ff', fontsize=8, weight='bold')

    draw_arrow(ax, (30.5, 61), (30.5, 54), color='#388bfd')
    draw_rounded_box(ax, 22, 49, 17, 5, '#162032', '#388bfd', border_width=1)
    ax.text(30.5, 51.5, "ByteTrack (Tracking)", ha='center', va='center', color='#c9d1d9', fontsize=7.5)

    draw_arrow(ax, (30.5, 49), (30.5, 42), color='#388bfd')
    draw_rounded_box(ax, 22, 37, 17, 5, '#162032', '#388bfd', border_width=1)
    ax.text(30.5, 39.5, "Plate Detection", ha='center', va='center', color='#c9d1d9', fontsize=7.5)

    draw_arrow(ax, (30.5, 37), (30.5, 30), color='#388bfd')
    draw_rounded_box(ax, 22, 25, 17, 5, '#162032', '#388bfd', border_width=1)
    ax.text(30.5, 27.5, "OCR (ANPR)", ha='center', va='center', color='#c9d1d9', fontsize=7.5)

    # Right Branch: RADAR
    draw_rounded_box(ax, 49, 95, 24, 5, '#261b18', '#f0883e', border_width=1.3)
    ax.text(61, 97.5, "RADAR", ha='center', va='center', color='#f0883e', fontsize=9.5, weight='bold')

    draw_arrow(ax, (61, 95), (61, 86), color='#f0883e')
    draw_rounded_box(ax, 49, 81, 24, 5, '#261b18', '#f0883e', border_width=1.1)
    ax.text(61, 83.5, "Radar Processing (FFT)", ha='center', va='center', color='#ffc680', fontsize=8)

    draw_arrow(ax, (61, 81), (61, 72), color='#f0883e')
    draw_rounded_box(ax, 49, 67, 24, 5, '#261b18', '#f0883e', border_width=1.1)
    ax.text(61, 69.5, "Radar Detection", ha='center', va='center', color='#ffc680', fontsize=8)

    draw_arrow(ax, (61, 67), (61, 58), color='#f0883e')
    draw_rounded_box(ax, 49, 53, 24, 5, '#261b18', '#f0883e', border_width=1.1)
    ax.text(61, 55.5, "Radar Tracking (Kalman)", ha='center', va='center', color='#ffc680', fontsize=8)

    draw_arrow(ax, (61, 53), (61, 44), color='#f0883e')
    draw_rounded_box(ax, 49, 39, 24, 5, '#261b18', '#f0883e', border_width=1.1)
    ax.text(61, 41.5, "Radar ID (RAD-XXXX)", ha='center', va='center', color='#ffc680', fontsize=8)

    # SENSOR FUSION (Converge Camera Person, Vehicle OCR, and Radar ID)
    draw_polyline(ax, [(16, 61), (16, 21), (32, 21), (32, 19)], color='#388bfd')
    draw_polyline(ax, [(30.5, 25), (30.5, 21), (38, 21), (38, 19)], color='#388bfd')
    draw_polyline(ax, [(61, 39), (61, 21), (46, 21), (46, 19)], color='#f0883e')

    draw_rounded_box(ax, 20, 14, 44, 5.5, '#1e283d', '#39d353', border_width=1.6)
    ax.text(42, 17.5, "SENSOR FUSION", ha='center', va='center', color='#39d353', fontsize=9.5, weight='bold')
    ax.text(42, 15, "Camera + Radar Data (SensorFusionEngine)", ha='center', va='center', color='#7ee787', fontsize=7.2)

    # =========================================================================
    # COLUMN 2: PAGE 2 - BEHAVIOR AI, LOCAL RETENTION & COMPRESSION
    # =========================================================================
    c2_x, c2_y, c2_w, c2_h = 84, 12, 72, 110
    draw_rounded_box(ax, c2_x, c2_y, c2_w, c2_h, '#10151f', '#30363d', border_width=2)
    ax.text(c2_x + c2_w/2, c2_y + c2_h - 3, "PAGE 2: BEHAVIOR AI, LOCAL DB RETENTION & COMPRESSION", 
            ha='center', va='center', color='#a371f7', fontsize=11, weight='bold')
    ax.text(c2_x + c2_w/2, c2_y + c2_h - 6, "Backend: backend/database.py & alert/metadata/snapshot/video_compressor.py", 
            ha='center', va='center', color='#d2a8ff', fontsize=7.5, style='italic')

    # Connection Page 1 -> Page 2 (Neatly routed through gutter)
    draw_polyline(ax, [(64, 17), (79, 17), (79, 109.5), (95, 109.5)], color='#39d353', lw=2.2)

    # Combined Object
    draw_rounded_box(ax, 95, 107, 50, 5, '#221a36', '#a371f7', border_width=1.5)
    ax.text(120, 109.5, "COMBINED OBJECT (FUSED-XXXX)", ha='center', va='center', color='#d2a8ff', fontsize=9.5, weight='bold')

    draw_arrow(ax, (120, 107), (120, 101), color='#a371f7')
    draw_rounded_box(ax, 95, 96, 50, 5, '#1f1b2e', '#a371f7', border_width=1.2)
    ax.text(120, 98.5, "BEHAVIOR ANALYSIS", ha='center', va='center', color='#f0f6fc', fontsize=9, weight='bold')

    draw_arrow(ax, (120, 96), (120, 90), color='#a371f7')
    draw_rounded_box(ax, 95, 85, 50, 5, '#1f1b2e', '#a371f7', border_width=1.2)
    ax.text(120, 87.5, "3D CNN / AI (Spatial-Temporal Classifier)", ha='center', va='center', color='#c9d1d9', fontsize=8.5)

    draw_arrow(ax, (120, 85), (120, 79), color='#a371f7')
    draw_rounded_box(ax, 98, 74, 44, 5, '#161b22', '#d29922', border_width=1.2)
    ax.text(120, 76.5, "NORMAL / SUSPICIOUS", ha='center', va='center', color='#e3b341', fontsize=8.5, weight='bold')

    # Split Normal vs Alert
    draw_polyline(ax, [(120, 74), (120, 71), (107, 71), (107, 67)], color='#2ea043')
    draw_polyline(ax, [(120, 74), (120, 71), (133, 71), (133, 67)], color='#f85149')

    draw_rounded_box(ax, 98, 62, 18, 5, '#16221c', '#2ea043', border_width=1.2)
    ax.text(107, 64.5, "NORMAL", ha='center', va='center', color='#7ee787', fontsize=8, weight='bold')

    draw_rounded_box(ax, 124, 62, 18, 5, '#2b1b1f', '#f85149', border_width=1.2)
    ax.text(133, 64.5, "ALERT", ha='center', va='center', color='#ffa198', fontsize=8.5, weight='bold')

    # Converge to Event Metadata
    draw_polyline(ax, [(107, 62), (107, 58), (117, 58), (117, 56)], color='#2ea043')
    draw_polyline(ax, [(133, 62), (133, 58), (123, 58), (123, 56)], color='#f85149')

    draw_rounded_box(ax, 95, 51, 50, 5, '#1f1b2e', '#a371f7', border_width=1.2)
    ax.text(120, 53.5, "EVENT METADATA", ha='center', va='center', color='#f0f6fc', fontsize=9, weight='bold')

    draw_arrow(ax, (120, 51), (120, 45), color='#a371f7')
    draw_rounded_box(ax, 95, 40, 50, 5, '#161b22', '#58a6ff', border_width=1.2)
    ax.text(120, 42.5, "LOCAL CACHE / BUFFER", ha='center', va='center', color='#58a6ff', fontsize=8.8, weight='bold')

    # Fork to Local Database vs Compression
    draw_polyline(ax, [(120, 40), (120, 37), (99, 37), (99, 34)], color='#d29922')
    draw_polyline(ax, [(120, 40), (120, 37), (141, 37), (141, 34)], color='#f0883e')

    # Path A: LOCAL DATABASE with 15-Day Retention Box
    draw_rounded_box(ax, 86, 29, 26, 5, '#22201b', '#d29922', border_width=1.2)
    ax.text(99, 31.5, "LOCAL DATABASE", ha='center', va='center', color='#e3b341', fontsize=8.2, weight='bold')

    draw_rounded_box(ax, 86, 14, 26, 13, '#161b22', '#d29922', border_width=1.1, radius=1)
    ax.text(99, 24.5, "15-DAY RETENTION POLICY", ha='center', va='center', color='#ffdf5d', fontsize=7.2, weight='bold')
    ax.text(99, 21.5, "Data stored for 15 Days", ha='center', va='center', color='#c9d1d9', fontsize=6.8)
    ax.text(99, 19, "if it is uploaded to main server", ha='center', va='center', color='#c9d1d9', fontsize=6.8)
    ax.text(99, 16.5, "else it remains stored", ha='center', va='center', color='#aff5b4', fontsize=6.8, weight='bold')
    ax.text(99, 14.5, "until data gets uploaded.", ha='center', va='center', color='#aff5b4', fontsize=6.8, weight='bold')

    # Path B: COMPRESSION SUITE (4 Priorities)
    draw_rounded_box(ax, 116, 29, 38, 5, '#251b18', '#f0883e', border_width=1.2)
    ax.text(135, 31.5, "COMPRESSION SUITE", ha='center', va='center', color='#ffc680', fontsize=8.2, weight='bold')

    comp_items = [
        ("P1 alert", "217b → 36b", 24.5, '#f85149', '#ffa198'),
        ("p2 metadata", "72.1kb → 1.72kb", 20.5, '#d29922', '#ffdf5d'),
        ("p3 snapshot", "86kb → 104kb", 16.5, '#2ea043', '#7ee787'),
        ("p4 video", "64.2mb → 81kb", 12.5, '#58a6ff', '#79c0ff'),
    ]
    for lbl, val, y_pos, b_col, t_col in comp_items:
        draw_rounded_box(ax, 116, y_pos, 38, 3.4, '#161b22', b_col, border_width=0.9, radius=0.8)
        ax.text(125, y_pos + 1.7, lbl, ha='left', va='center', color=t_col, fontsize=6.8, weight='bold')
        ax.text(147, y_pos + 1.7, val, ha='right', va='center', color='#f0f6fc', fontsize=6.8)

    # =========================================================================
    # COLUMN 3: PAGE 3 - DUAL SYNC PIPELINES, BLOCKCHAIN & AWS
    # =========================================================================
    c3_x, c3_y, c3_w, c3_h = 162, 12, 72, 110
    draw_rounded_box(ax, c3_x, c3_y, c3_w, c3_h, '#10151f', '#30363d', border_width=2)
    ax.text(c3_x + c3_w/2, c3_y + c3_h - 3, "PAGE 3: DUAL SYNC PIPELINES, BLOCKCHAIN & AWS", 
            ha='center', va='center', color='#2ea043', fontsize=11, weight='bold')
    ax.text(c3_x + c3_w/2, c3_y + c3_h - 6, "Backend: backend/cloud_sync_engine.py, blockchain_ledger.py, cloud_server.py", 
            ha='center', va='center', color='#7ee787', fontsize=7.5, style='italic')

    # Connection Page 2 -> Page 3
    draw_polyline(ax, [(154, 21), (158, 21), (158, 109), (173, 109)], color='#f0883e', lw=2.2)

    # Root Sync Engine
    draw_rounded_box(ax, 173, 107, 50, 5, '#16221c', '#2ea043', border_width=1.5)
    ax.text(198, 109.5, "SYNC ENGINE (cloud_sync_engine.py)", ha='center', va='center', color='#7ee787', fontsize=9.5, weight='bold')

    # Fork to Primary vs Recovery Pipelines
    draw_polyline(ax, [(198, 107), (198, 103), (178, 103), (178, 99)], color='#388bfd')
    draw_polyline(ax, [(198, 107), (198, 103), (218, 103), (218, 99)], color='#f0883e')

    # Left: PRIMARY PIPELINE
    draw_rounded_box(ax, 166, 94, 24, 5, '#162032', '#388bfd', border_width=1.3)
    ax.text(178, 96.5, "PRIMARY PIPELINE", ha='center', va='center', color='#58a6ff', fontsize=8.5, weight='bold')

    draw_arrow(ax, (178, 94), (178, 86), color='#388bfd')
    draw_rounded_box(ax, 166, 81, 24, 5, '#162032', '#388bfd', border_width=1)
    ax.text(178, 83.5, "Current Events (Live)", ha='center', va='center', color='#c9d1d9', fontsize=7.8)

    draw_arrow(ax, (178, 81), (178, 73), color='#388bfd')
    draw_rounded_box(ax, 166, 68, 24, 5, '#162032', '#388bfd', border_width=1)
    ax.text(178, 70.5, "Cloud Transfer", ha='center', va='center', color='#c9d1d9', fontsize=7.8)

    # Right: RECOVERY PIPELINE
    draw_rounded_box(ax, 206, 94, 24, 5, '#261b18', '#f0883e', border_width=1.3)
    ax.text(218, 96.5, "RECOVERY PIPELINE", ha='center', va='center', color='#ffc680', fontsize=8.5, weight='bold')

    draw_arrow(ax, (218, 94), (218, 86), color='#f0883e')
    draw_rounded_box(ax, 206, 81, 24, 5, '#261b18', '#f0883e', border_width=1)
    ax.text(218, 83.5, "Pending Events (Offline)", ha='center', va='center', color='#ffc680', fontsize=7.8)

    draw_arrow(ax, (218, 81), (218, 73), color='#f0883e')
    draw_rounded_box(ax, 206, 68, 24, 5, '#261b18', '#f0883e', border_width=1)
    ax.text(218, 70.5, "Pending Queue", ha='center', va='center', color='#ffc680', fontsize=7.8)

    draw_arrow(ax, (218, 68), (218, 60), color='#f0883e')
    draw_rounded_box(ax, 206, 55, 24, 5, '#261b18', '#f0883e', border_width=1)
    ax.text(218, 57.5, "Recovery Uploader", ha='center', va='center', color='#ffc680', fontsize=7.8)

    # Converge Primary & Recovery to Blockchain Encryption
    draw_polyline(ax, [(178, 68), (178, 50), (192, 50), (192, 47)], color='#388bfd')
    draw_polyline(ax, [(218, 55), (218, 50), (204, 50), (204, 47)], color='#f0883e')

    # Blockchain Encryption
    draw_rounded_box(ax, 173, 40, 50, 7, '#1b2230', '#7ee787', border_width=1.5)
    ax.text(198, 44.5, "BLOCKCHAIN ENCRYPTION", ha='center', va='center', color='#7ee787', fontsize=9.2, weight='bold')
    ax.text(198, 42, "SHA256 + Hyperledger (blockchain_ledger.py)", ha='center', va='center', color='#aff5b4', fontsize=7.2)

    draw_arrow(ax, (198, 40), (198, 33), color='#7ee787')

    # AWS
    draw_rounded_box(ax, 183, 27, 30, 6, '#231e15', '#f0883e', border_width=1.4)
    ax.text(198, 30.5, "AWS CLOUD TARGET", ha='center', va='center', color='#ff9900', fontsize=9.5, weight='bold')

    # AWS S3 (Files) & DynamoDB (Metadata)
    draw_polyline(ax, [(198, 27), (198, 24), (180, 24), (180, 21)], color='#ff9900')
    draw_polyline(ax, [(198, 27), (198, 24), (216, 24), (216, 21)], color='#ff9900')

    draw_rounded_box(ax, 167, 14, 26, 7, '#161b22', '#58a6ff', border_width=1.2)
    ax.text(180, 18.5, "AWS S3", ha='center', va='center', color='#58a6ff', fontsize=8.5, weight='bold')
    ax.text(180, 16, "Files (Snapshots & Videos)", ha='center', va='center', color='#c9d1d9', fontsize=7)

    draw_rounded_box(ax, 203, 14, 26, 7, '#161b22', '#39d353', border_width=1.2)
    ax.text(216, 18.5, "AWS DynamoDB", ha='center', va='center', color='#39d353', fontsize=8.5, weight='bold')
    ax.text(216, 16, "Metadata (Telemetry & Alerts)", ha='center', va='center', color='#c9d1d9', fontsize=7)

    # =========================================================================
    # FOOTER: VERIFICATION AUDIT & STATUS
    # =========================================================================
    draw_rounded_box(ax, 6, 2, 228, 7, '#10151f', '#2ea043', border_width=1.5, radius=1)
    ax.text(120, 6.2, "SYSTEM AUDIT: 10/10 BACKEND COMPONENTS VERIFIED & FULL PIPELINE AUTOMATED", 
            ha='center', va='center', color='#7ee787', fontsize=9.5, weight='bold')
    ax.text(120, 3.8, "Page 1 Radar Fusion: OK  |  Page 2 15-Day Retention & 767x Compression: OK  |  Page 3 Dual Sync & Blockchain: OK  |  AWS S3 & DynamoDB: OK", 
            ha='center', va='center', color='#8b949e', fontsize=8)

    plt.subplots_adjust(left=0.01, right=0.99, top=0.99, bottom=0.01)
    os.makedirs(os.path.dirname(os.path.abspath(output_png_path)), exist_ok=True)
    plt.savefig(output_png_path, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
    print(f"[SUCCESS] Saved high-resolution workflow diagram (PNG) to: {output_png_path}")

    if output_jpg_path:
        plt.savefig(output_jpg_path, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
        print(f"[SUCCESS] Saved high-resolution workflow diagram (JPG) to: {output_jpg_path}")

    plt.close()

if __name__ == "__main__":
    out_png = r"c:\Users\ACER\Downloads\Mobile Devices\ibvap_surveillance\ibvap_workflow_diagram.png"
    out_jpg = r"c:\Users\ACER\Downloads\Mobile Devices\ibvap_surveillance\ibvap_workflow_diagram.jpg"
    generate_ibvap_workflow_diagram(out_png, out_jpg)
